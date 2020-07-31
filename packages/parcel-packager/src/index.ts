const { Packager } = require('@parcel/plugin');
import {
    Messages,
    generatePrecompiledMessages,
} from '@traduki/build-utils';

export default new Packager({
    async package({ bundle }: any) {
        let assets: any = [];

        bundle.traverseAssets((asset: any) => {
            assets.push(asset);
        });

        const localMessages: Messages[] = await Promise.all(assets.map((asset: any) => {
            return asset.getCode().then((json: any) => JSON.parse(json));
        }));

        const locale = assets[0].meta.locale;

        const messages = localMessages.reduce((prev: Messages, messages: Messages) => ({
            ...prev,
            ...messages,
        }), {} as Messages);

        const contents = generatePrecompiledMessages(locale, messages, 'esm');

        return { contents, type: `${locale}.js` };
    },
});
